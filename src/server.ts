import express, { Application } from 'express';
import mongoose from 'mongoose';
import cors from 'cors'

class App {
  public express: Application;
  public port: number;

  constructor(controllers: Controller[], port: number) {
    this.express = express();
    this.port = port;
  }
}