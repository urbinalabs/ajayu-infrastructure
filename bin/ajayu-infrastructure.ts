#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Metabase } from '../lib/metabase-stack';

const app = new cdk.App();

const metabase = new Metabase(app, 'Metabase');
