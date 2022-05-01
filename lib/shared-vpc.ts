import * as cdk from 'aws-cdk-lib';
import { aws_ec2 as ec2 } from 'aws-cdk-lib';

export class SharedVpc extends cdk.Stack {

  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
     this.vpc = new ec2.Vpc(this, 'VPC', {
       enableDnsHostnames: true,
       enableDnsSupport: true,
       maxAzs: 2,
       natGateways: 0,
       subnetConfiguration: [
         {
           cidrMask: 24,
           name: 'public',
           subnetType: ec2.SubnetType.PUBLIC
         }
       ]
     }); 
  }
}
