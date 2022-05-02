import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    CodePipeline,
    CodePipelineSource,
    ShellStep,
    ManualApprovalStep
} from 'aws-cdk-lib/pipelines';
import { Metabase } from './metabase-stack';

export class Pipeline extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const pipeline = new CodePipeline(this, 'Pipeline', {
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.gitHub('urbinalabs/ajayu-infrastructure', 'main'),
                commands: ['node -v', 'npm ci', 'npm run build', 'npx cdk synth']
            })
        });

        const stage = pipeline.addStage(new Metabase(this, 'Prod'));
        stage.addPre(new ManualApprovalStep('approval'));
    }
}
