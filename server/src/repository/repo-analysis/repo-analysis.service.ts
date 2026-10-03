import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OpenAI } from 'openai';

@Injectable()
export class RepoAnalysisService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(RepoAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is required. Set it before starting the server.',
      );
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      timeout: Number(process.env.OPENAI_TIMEOUT_MS || 120000),
    });
  }

  async analyzeRepositoryStructure(repoId: string) {
    this.logger.log(`Starting structural analysis for repo: ${repoId}`);

    // 1. Fetch files likely to contain routes, APIs, or pages
    const relevantFiles = await this.prisma.file.findMany({
      where: {
        repoId,
        OR: [
          { path: { contains: 'controller' } },
          { path: { contains: 'route' } },
          { path: { contains: 'api' } },
          { path: { contains: 'page' } },
          { path: { contains: 'app/' } }, // Next.js app router
          { path: { contains: 'pages/' } }, // Next.js pages router
        ],
      },
      include: {
        chunks: {
          orderBy: {
            startLine: 'asc',
          },
        },
      },
    });

    if (!relevantFiles.length) {
      this.logger.warn(`No routing files found for repo ${repoId}`);
      return;
    }

    // 2. Reconstruct file contents from chunks for context
    let combinedContext = '';
    for (const file of relevantFiles) {
      const fileContent = file.chunks.map((c) => c.content).join('\n');
      combinedContext += `\n--- FILE: ${file.path} ---\n${fileContent}\n`;
    }

    // Token safety check (truncate roughly to fit context limits if massive)
    const maxChars = 300000; // Roughly ~75k tokens
    if (combinedContext.length > maxChars) {
      combinedContext = combinedContext.substring(0, maxChars);
    }

    // 3. Call OpenAI with Strict JSON Schema
    try {
      const extraction = await this.extractArchitectureWithAI(combinedContext);

      // 4. Save to Database (RepoAnalysis summary)
      const analysis = await this.prisma.repoAnalysis.upsert({
        where: { repoId },
        update: {
          apis: extraction.apis,
          pages: extraction.pages,
        },
        create: {
          repoId,
          apis: extraction.apis,
          pages: extraction.pages,
        },
      });

      // 5. Sync individual ApiEndpoint and PageRoute tables using the saved data
      await this.syncEndpointsAndRoutesFromAnalysis(
        repoId,
        analysis.apis,
        analysis.pages,
      );

      // 6. Extract database schema and sync DatabaseTable / SchemaRelation records
      if (this.prisma.databaseSchema) {
        try {
          await this.analyzeDatabaseSchema(repoId);
        } catch (schemaError) {
          this.logger.warn(
            `Database schema extraction failed for repo ${repoId}:`,
            schemaError,
          );
        }
      }

      this.logger.log(`Analysis complete for repo: ${repoId}`);
    } catch (error) {
      this.logger.error(`Failed to analyze repo ${repoId}:`, error);
      throw error;
    }
  }

  private async extractArchitectureWithAI(codeContext: string) {
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'qwen3.7-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a senior software architect. Analyze the provided codebase files and extract all API endpoints and frontend page routes. Return ONLY valid JSON matching the schema.',
        },
        {
          role: 'user',
          content: codeContext,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'architecture_extraction',
          schema: {
            type: 'object',
            properties: {
              apis: {
                type: 'array',
                description: 'List of backend API endpoints found in the code.',
                items: {
                  type: 'object',
                  properties: {
                    method: {
                      type: 'string',
                      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'ALL'],
                    },
                    endpoint: {
                      type: 'string',
                      description: 'The URL path, e.g., /api/v1/users',
                    },
                    description: {
                      type: 'string',
                      description: 'Brief summary of what the endpoint does',
                    },
                    file: {
                      type: 'string',
                      description: 'The file path where this is defined',
                    },
                  },
                  required: ['method', 'endpoint', 'description', 'file'],
                  additionalProperties: false,
                },
              },
              pages: {
                type: 'array',
                description: 'List of frontend pages/routes found in the code.',
                items: {
                  type: 'object',
                  properties: {
                    route: {
                      type: 'string',
                      description:
                        'The frontend route path, e.g., /dashboard/settings',
                    },
                    description: {
                      type: 'string',
                      description: 'Brief summary of what this page displays',
                    },
                    file: {
                      type: 'string',
                      description: 'The file path where this is defined',
                    },
                  },
                  required: ['route', 'description', 'file'],
                  additionalProperties: false,
                },
              },
            },
            required: ['apis', 'pages'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error(
        'Failed to extract repository architecture: OpenAI returned an empty response.',
      );
    }
    return JSON.parse(result); // Strongly typed by OpenAI strict schema
  }

  private async syncEndpointsAndRoutesFromAnalysis(
    repoId: string,
    apisJson: any,
    pagesJson: any,
  ) {
    const apis = (apisJson as any[]) || [];
    const pages = (pagesJson as any[]) || [];

    // Fetch all files in the repo to map the AI's file path to database fileIds
    const files = await this.prisma.file.findMany({ where: { repoId } });

    const findFileId = (filePath: string): string => {
      const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\.?\//, '');

      let matchedFile = files.find((f) => f.path === normalizedPath);
      if (matchedFile) return matchedFile.id;

      matchedFile = files.find(
        (f) =>
          normalizedPath.endsWith(f.path) || f.path.endsWith(normalizedPath),
      );
      if (matchedFile) return matchedFile.id;

      return files[0]?.id || ''; // Fallback to first file if not found
    };

    // Populate ApiEndpoint entries
    const apiData = apis.map((api: any) => ({
      repoId,
      fileId: findFileId(api.file),
      path: api.endpoint,
      method: api.method,
      outputSchema: { description: api.description } as any,
    }));

    if (apiData.length > 0) {
      await this.prisma.apiEndpoint.createMany({ data: apiData });
    }

    // Populate PageRoute entries
    const pageData = pages.map((page: any) => ({
      repoId,
      fileId: findFileId(page.file),
      routePath: page.route,
      dependencies: { description: page.description } as any,
    }));

    if (pageData.length > 0) {
      await this.prisma.pageRoute.createMany({ data: pageData });
    }
  }

  async analyzeDatabaseSchema(repoId: string) {
    this.logger.log(`Starting database schema analysis for repo: ${repoId}`);

    // 1. Fetch schema, migration, or entity definition files
    const schemaFiles = await this.prisma.file.findMany({
      where: {
        repoId,
        OR: [
          { path: { endsWith: '.prisma' } },
          { path: { endsWith: '.sql' } },
          { path: { contains: 'schema' } },
          { path: { contains: 'entity' } },
          { path: { contains: 'entities' } },
          { path: { contains: 'model' } },
          { path: { contains: 'models' } },
          { path: { contains: 'migration' } },
        ],
      },
      include: {
        chunks: {
          orderBy: {
            startLine: 'asc',
          },
        },
      },
    });

    if (!schemaFiles.length) {
      this.logger.warn(`No schema or entity files found for repo: ${repoId}`);
      return null;
    }

    // 2. Reconstruct file contents from chunks
    let combinedContext = '';
    for (const file of schemaFiles) {
      const fileContent = file.chunks.map((c) => c.content).join('\n');
      combinedContext += `\n--- FILE: ${file.path} ---\n${fileContent}\n`;
    }

    const maxChars = 300000;
    if (combinedContext.length > maxChars) {
      combinedContext = combinedContext.substring(0, maxChars);
    }

    // 3. Extract tables and relations with OpenAI structured outputs
    const extraction = await this.extractDatabaseSchemaWithAI(combinedContext);

    // 4. Upsert DatabaseSchema and sync tables and relations inside a transaction
    const dbSchema = await this.prisma.databaseSchema.upsert({
      where: { repoId },
      create: { repoId },
      update: {},
    });

    await this.prisma.$transaction([
      this.prisma.databaseTable.deleteMany({
        where: { schemaId: dbSchema.id },
      }),
      this.prisma.schemaRelation.deleteMany({
        where: { schemaId: dbSchema.id },
      }),
      this.prisma.databaseTable.createMany({
        data: extraction.tables.map((tbl: any, idx: number) => ({
          schemaId: dbSchema.id,
          name: tbl.name,
          description: tbl.description || null,
          positionX: 50 + (idx % 3) * 360,
          positionY: 60 + Math.floor(idx / 3) * 340,
          columns: tbl.columns,
        })),
      }),
      this.prisma.schemaRelation.createMany({
        data: extraction.relations.map((rel: any) => ({
          schemaId: dbSchema.id,
          sourceTable: rel.sourceTable,
          sourceColumn: rel.sourceColumn,
          targetTable: rel.targetTable,
          targetColumn: rel.targetColumn,
          cardinality: rel.cardinality || 'one-to-many',
          label:
            rel.label ||
            (rel.cardinality === 'one-to-many'
              ? '1:N'
              : rel.cardinality === 'many-to-many'
                ? 'M:N'
                : '1:1'),
        })),
      }),
    ]);

    this.logger.log(
      `Database schema extracted for repo ${repoId}: ${extraction.tables.length} tables, ${extraction.relations.length} relations`,
    );

    return dbSchema;
  }

  private async extractDatabaseSchemaWithAI(codeContext: string) {
    const response = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'qwen3.7-flash',
      messages: [
        {
          role: 'system',
          content:
            'You are a principal database architect. Analyze the provided schema definitions, migrations, and entities. Extract the complete relational database schema: all tables with columns (primary keys, foreign keys, types, nullable, unique, default values) and inter-table relationships. Return ONLY valid JSON adhering strictly to the schema.',
        },
        {
          role: 'user',
          content: codeContext,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'database_schema_extraction',
          schema: {
            type: 'object',
            properties: {
              tables: {
                type: 'array',
                description: 'Relational database tables discovered in the code.',
                items: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      description: 'Name of the database table or model',
                    },
                    description: {
                      type: 'string',
                      description: 'Summary of the table purpose and domain',
                    },
                    columns: {
                      type: 'array',
                      description: 'Columns belonging to this table',
                      items: {
                        type: 'object',
                        properties: {
                          name: {
                            type: 'string',
                            description: 'Column name',
                          },
                          type: {
                            type: 'string',
                            description:
                              'Data type (e.g. String, Int, DateTime, Uuid, Boolean, Enum)',
                          },
                          isPrimaryKey: {
                            type: 'boolean',
                            description: 'Whether this column is the primary key',
                          },
                          isForeignKey: {
                            type: 'boolean',
                            description:
                              'Whether this column references another table',
                          },
                          isNullable: {
                            type: 'boolean',
                            description:
                              'Whether this column accepts null values',
                          },
                          isUnique: {
                            type: 'boolean',
                            description:
                              'Whether this column has a unique constraint',
                          },
                          defaultValue: {
                            type: ['string', 'null'],
                            description: 'Default value as string or null if none',
                          },
                        },
                        required: [
                          'name',
                          'type',
                          'isPrimaryKey',
                          'isForeignKey',
                          'isNullable',
                          'isUnique',
                          'defaultValue',
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ['name', 'description', 'columns'],
                  additionalProperties: false,
                },
              },
              relations: {
                type: 'array',
                description: 'Foreign key relationships connecting tables',
                items: {
                  type: 'object',
                  properties: {
                    sourceTable: {
                      type: 'string',
                      description: 'Source table containing the foreign key',
                    },
                    sourceColumn: {
                      type: 'string',
                      description: 'Foreign key column on the source table',
                    },
                    targetTable: {
                      type: 'string',
                      description: 'Referenced target table',
                    },
                    targetColumn: {
                      type: 'string',
                      description:
                        'Referenced primary or unique key column on the target table',
                    },
                    cardinality: {
                      type: 'string',
                      enum: ['one-to-one', 'one-to-many', 'many-to-many'],
                    },
                    label: {
                      type: 'string',
                      description:
                        'Display label for the relation (e.g. 1:N, M:N, 1:1)',
                    },
                  },
                  required: [
                    'sourceTable',
                    'sourceColumn',
                    'targetTable',
                    'targetColumn',
                    'cardinality',
                    'label',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['tables', 'relations'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const result = response.choices[0].message.content;
    if (!result) {
      throw new Error(
        'Failed to extract database schema: OpenAI returned an empty response.',
      );
    }
    return JSON.parse(result);
  }
}
