import { Module } from '@nestjs/common';
import { RepoAnalysisService } from './repo-analysis.service';

@Module({
  providers: [RepoAnalysisService],
  exports: [RepoAnalysisService]
})
export class RepoAnalysisModule {}
