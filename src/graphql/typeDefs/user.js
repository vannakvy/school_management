import {
    gql
} from "apollo-server-express";

export default gql`
    extend type Query {
        # the rules start from the right to the left
        authUser: User!
        allUsers:[User!]
        getCurrentUser:User! 
        getUserWithPagination(page:Int,limit:Int,keyword:String):UserPaginator! 
    }
    
    extend type Mutation {
        registerUser(newUser: UserInput!): userResponse!
        updateRole(userId:ID!role:String!): userResponse!
        addPage(userId:ID!page:String!): userResponse!
        deleteRole(userId:ID!,roleId:ID!): userResponse!
        deletePages(userId:ID!,pageId:ID!): userResponse!
        loginUser(email: String!, password: String!):Loggineduser! 
        deleteUser(userId:ID!):userResponse!
        updateAccount(userId:ID!,password:String!,username:String!):userResponse!
        updateUserDetail(userId:ID!,tel:String!,firstName:String!,lastName:String!,email:String!):userResponse!
        updateProfileImage(userId:ID!,image:String!):userResponse!
        refreshToken(refreshToken:String):String,
        logoutUser:userResponse!
    }

    type Loggineduser{
        token:String
        refreshToken:String
         user:User
    }
    input UserInput {
        email:String!
        lastName: String!
        password: String!
        firstName: String!
        role: String!
        page:String,
        tel:String!
    }

    type User {
        id: ID!
        email:String!
        
        lastName: String!
        firstName: String!
        image:String
        roles:String
        pages:[Page]!
        createdAt: String
        updatedAt: String
        tel:String
    }

    # type AuthUser {
    #     user: User!
    #     token:String!
    # }
    type Role {
       id:ID!
       role:String!
      }
      type Page {
       id:ID!
       page:String!
      }

      type userResponse{
          success: Boolean!
          message: String!

      }

    #   //for building the customer date 

     scalar Date

      type UserPaginator {
        users: [User!]!
        paginator: Paginator!
    }
    type Paginator {
        slNo: Int
        prev: Int
        next: Int
        perPage: Int
        totalPosts: Int
        totalPages: Int
        currentPage: Int
        hasPrevPage: Boolean
        hasNextPage: Boolean
        totalDocs:Int
    }
`;

