import { ApolloServer ,gql} from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import express from 'express';
import http from 'http';
import dotenv from 'dotenv'
import connectDB from './config/db';
import typeDefs from './graphql/typeDefs'
import resolvers from './graphql/resolvers'
import * as AppModels from './models'
import {rule, shield} from 'graphql-shield'
import {applyMiddleware} from 'graphql-middleware';
import {makeExecutableSchema} from 'graphql-tools'


dotenv.config();

async function startApolloServer(typeDefs, resolvers) {
  connectDB()
    // Required logic for integrating with Express
    const schema = makeExecutableSchema(typeDefs,resolvers)
    const app = express();
    const httpServer = http.createServer(app);
    // Same ApolloServer initialization as before, plus the drain plugin.
   const isAuthenticated = rule()(async(parents,args,context,info)=>{
     console.log(context);
   })
    const permissions = shield({
      Query:{
        allUsers:isAuthenticated
      },
      Mutation:{

      }
    });
    // const scheamWithPermission = applyMiddleware(shema,permissions);
    const server = new ApolloServer({
      schema: applyMiddleware(schema,permissions),
      // typeDefs,
      // resolvers,
      plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
      context:()=>{
          return {...AppModels};
      }
    });
  
    // More required logic for integrating with Express
    await server.start();
    server.applyMiddleware({
       app,
      permissions,
       // By default, apollo-server hosts its GraphQL endpoint at the
       // server root. However, *other* Apollo Server packages host it at
       // /graphql. Optionally provide this to match apollo-server.
       path: '/'
    });
  
    // Modified server startup
    await new Promise(resolve => httpServer.listen({ port: process.env.PORT || 4000 }, resolve));
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`);
  }


  startApolloServer(typeDefs,resolvers);