import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';
import { aws_rds as rds } from 'aws-cdk-lib';
import { aws_secretsmanager as secrets } from 'aws-cdk-lib';

export interface RdsClusterProps {
    readonly vpc: ec2.Vpc;
}

export class RdsCluster extends cdk.Stack {

    public readonly databaseName: string;
    public readonly username: string;
    public readonly secret: secrets.Secret | undefined;

    constructor(scope: cdk.App, id: string, props: RdsClusterProps) {
        super(scope, id);

        this.databaseName = "metabase";
        this.username = "metabase";
    }
}
