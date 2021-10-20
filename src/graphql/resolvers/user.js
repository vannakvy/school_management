import { hash, compare } from "bcryptjs";

import { ApolloError } from "apollo-server-express";


import {
  serializeUser,
  issueAuthToken,
  issueAuthRefreshToken,
} from "../../helpers/Userfunctions";

import {
  UserRegisterationRules,
  UserAuthenticationRules,
} from "../../validations";
import { partial } from "lodash";

const UserLabels = {
  docs: "users",
  limit: "perPage",
  nextPage: "next",
  prevPage: "prev",
  meta: "paginator",
  page: "currentPage",
  pagingCounter: "slNo",
  totalDocs: "totalDocs",
  totalPages: "totalPages",
};

export default {
  // Standarad User Query Property
  Query: {
    /**
     * @DESC to get the authenticated User
     * @Headers Authorization
     * @Access Private
     */
    authUser: (_, __, { req: { user } }) => user,

    // @Desc get all users
    // @Access

    allUsers: async (_, {}, { User }) => {
      const users = await User.find({});
      // throw new ApolloError("Username not found", "404");
      return users;
    },
    getCurrentUser: async (_, {}, { user }) => {
      if (!user) {
        throw new ApolloError("សូមមេត្តា login ជាថ្មី");
      }
      return user;
    },

    //@Desc get all users with pagination

    getUserWithPagination: async (
      _,
      { page, limit, keyword = "" },
      { User }
    ) => {
      let key = keyword.toString();
      const options = {
        page: page || 1,
        limit: limit || 10,
        customLabels: UserLabels,
        sort: {
          createdAt: -1,
        },
        // populate: "customer",
      };

      let query = {
        $or: [
          { firstName: { $regex: key, $options: "i" } },
          { lastName: { $regex: key, $options: "i" } },
          { email: { $regex: key, $options: "i" } },
        ],
      };

      let users = await User.paginate(query, options);
      // console.log(users)
      return users;
    },
  },
  // Standarad User Mutation Property

  Mutation: {
    /**
     * @DESC to authenticate using parameters
     * @Params { username, password }
     * @Access Public
     */
    loginUser: async (_, { email, password }, { User, RefreshToken }) => {
      // Validate Incoming User Credentials
      await UserAuthenticationRules.validate(
        { email, password },
        { abortEarly: false }
      );
      // Find the user from the database
      let user = await User.findOne({
        email,
      });

      // If User is not found
      if (!user) {
        throw new ApolloError("Username not found", "404");
      }
      // If user is found then compare the password
      let isMatch = await compare(password, user.password);
      // If Password don't match
      if (!isMatch) {
        throw new ApolloError("The password is not correct");
      }
      user = await serializeUser(user);

      // Issue Token
      let token = await issueAuthToken(user);
      let refreshToken = await issueAuthRefreshToken(user);
      let deleteToken = await RefreshToken.findOne({user:user.id});
      if(deleteToken){

      }
      let refresh_token = new RefreshToken({
        refreshToken: refreshToken.refreshToken,
        user: user.id,
      });
      let savedRefresh_token = await refresh_token.save();
      if (!savedRefresh_token) {
        throw new ApolloError("មានបញ្ហាបច្ចេកទេស RFT_ សូមទាក់ទងខាង IT");
      }
      return {
        token: token,
        refreshToken: refreshToken,
        user: user,
      };
    },
    /**
     * @DESC to refresh token
     * @Params { username, password }
     * @Access Public
     */
    refreshToken: async (_, { requestToken }, { User, RefreshToken }) => {
      try {
        if (!requestToken) {
          throw new ApolloError("មានបញ្ហាបច្ចេកទេស RFT_ សូមទាក់ទងខាង IT");
        }
        let get_token = await RefreshToken.findOne({
          refreshToken: requestToken,
        });
        if (!get_token) {
          throw new ApolloError("មានបញ្ហាបច្ចេកទេស RFT_ សូមទាក់ទងខាង IT");
        }

        let user = await User.findById(get_token.user);
        // regenerate access token
        let token = await issueAuthToken(user);

        return token;
      } catch (error) {
        throw new ApolloError("មានបញ្ហាបច្ចេកទេស RFT_ សូមទាក់ទងខាង IT");
      }
      // Find the user from the database
      // If User is not found
    },

    /**
     * @DESC add role
     * @Params userId and new role
     * @Access admin
     */

    updateRole: async (_, { userId, role }, { User }) => {
      try {
        let isExisted = await User.findById(userId);
        if (!isExisted) {
          return {
            message: "មិនមានបុគ្គលនៅក្នុងនេះទេ",
            success: false,
          };
        }

  
      let a =  await User.updateOne({_id:userId},{$set:{
          roles:role
        }});        
        return {
          message: "បញ្ចូលបានជោកជ័យ",
          success: true,
        };
      } catch (error) {
        return {
          message: "មិនអាចបញ្ចូលបានទេ",
          success: error.message,
        };
      }
    },

    //@Desc add page
    //@Access auth

    addPage: async (_, { userId, page }, { User }) => {
      try {
        let isExisted = await User.findById(userId);
        if (!isExisted) {
          return {
            message: "មិនមានបុគ្គលនៅក្នុងនេះទេ",
            success: false,
          };
        }

        let isAlreadyIn = await User.findOne({
          $and: [{ _id: userId }, { pages: { $elemMatch: { page: page } } }],
        });

        if (isAlreadyIn) {
          return {
            message: "page នេះបានបញ្ចូលរួចហើយ",
            success: false,
          };
        }
        await User.updateOne(
          { _id: userId },
          {
            $push: {
              pages: {
                $each: [{ page }],
                // $sort: { score: 1 },
                $slice: -30,
              },
            },
          }
        );
        return {
          message: "បញ្ចូលបានជោកជ័យ",
          success: true,
        };
      } catch (error) {
        return {
          message: "មិនអាចបញ្ចូលបានទេ",
          success: error.message,
        };
      }
    },

    // @DESC deleteRole
    // @params userid , role id
    // @access Admin
    deleteRole: async (_, { userId, roleId }, { User }) => {
      try {
        let a = await User.updateOne(
          { _id: userId },
          {
            $pull: { roles: { _id: roleId } },
          }
        );

        return {
          success: true,
          message: "លុបបានជោគជ័យ",
        };
      } catch (error) {
        return {
          success: false,
          message: `លុបមិនបានជោគជ័យ សូមទាក់ទងអេតមិន ជាមួសារនេះ ${error.message}`,
        };
      }
    },

    //Desc delete the page they can see
    //@Access auth
    deletePages: async (_, { userId, pageId }, { User }) => {
      try {
        let a = await User.updateOne(
          { _id: userId },
          {
            $pull: { pages: { _id: pageId } },
          }
        );

        return {
          success: true,
          message: "លុបបានជោគជ័យ",
        };
      } catch (error) {
        return {
          success: false,
          message: `លុបមិនបានជោគជ័យ សូមទាក់ទងអេតមិន ជាមួសារនេះ ${error.message}`,
        };
      }
    },

    // deleteRole: async (_, { userId, roleId }, { User }) => {
    //   try {
    //     const res = await User.findById(userId);
    //     const hasRole = res.roles.find(
    //       (r) => r._id.toString() === roleId.toString()
    //     );

    //     if (!hasRole) {
    //       return {
    //         success: false,
    //         message: "There is no this role in this user",
    //       };
    //     }

    //     res.roles.id(hasRole._id).remove();
    //     await res.save();

    //     // doc.subdocs.pull({ _id: 4815162342 })  => the second way to delete below object in array of subdocs
    //     return {
    //       success: true,
    //       message: "Role Deleted successfully!",
    //     };
    //   } catch (error) {
    //     return {
    //       success: false,
    //       message: "Role Delete is not completed !",
    //     };
    //   }
    // },
    /**
     * @DESC to Register new user
     * @Params newUser{ username, firstName, lastName, email, password }
     * @Access Public
     */
    registerUser: async (_, { newUser }, { User }) => {
      try {
        let { email,firstName, lastName} = newUser;
        // Validate Incoming New User Arguments
        await UserRegisterationRules.validate(newUser, { abortEarly: false });
        
        // Check is the Email address is already registred
     const emailExisted= await User.findOne({
          email,
        });
        if (emailExisted) {
          return {
            success: false,
            message: "the email is already token",
          };
        }

    const firstNameAndLastNameExisted = await User.findOne({$and:[{firstName:firstName},{lastName:lastName}]});
    if(firstNameAndLastNameExisted){
      return {
        success: false,
        message: "the firstname and lastname is already token",
      }
    }
        // New User's Account can be created
        let user = new User(newUser);
        // console.log(user)
     
    
        // Hash the user password
        user.password = await hash(user.password, 10);
        // Save the user to the database
        let result = await user.save();

        result = await serializeUser(result);
        // // Issue Token
        let token = await issueAuthToken(result);
        
        if (result) {
          return {
            success: true,
            message: " The user is created successfully !",
          };
        }
      } catch (err) {
        return {
          success: false,
          message: " Cannot create this user please contact the admin "+ err.message,
        };
      }
    },
    //  /**
    //  * @DESC to Update  user
    //  * @Params newUser{ username, firstName, lastName, email, password }
    //  * @Access Private
    //  */
    updateAccount: async (_, { userId, password, username }, { User }) => {
      try {
        let userExist = await User.findById(userId);
        let user = await User.findOne({
          username,
        });
        // console.log(userExist,"ddd")
        // console.log(user,"bb")

        if (userExist) {
          // Check if the Username is taken
          if (user === null || userExist.username === username) {
            userExist.username = username;
            userExist.password = await hash(password, 10);
            let result = await userExist.save();

            return {
              message: "Successfully update the Account",
              success: true,
            };
          } else {
            return {
              message: "Cannot update this account",
              success: false,
            };
          }
        }
      } catch (err) {
        return {
          message: "This user is not exist",
          success: false,
        };
      }
    },

    //  /**
    //  * @DESC to Update  user
    //  * @Params newUser{ username, firstName, lastName, email, password }
    //  * @Access Private
    //  */
    //   updateUser: async (_, { updatedUser,userId }, { User }) => {
    //     try {
    //       let { email, username } = updatedUser;

    //       // Validate Incoming New User Arguments
    //       await UserRegisterationRules.validate(updatedUser, { abortEarly: false });
    //       // Check if the Username is taken
    //       let user = await User.findOne({
    //         username,
    //       });
    //       // if (user && user.id!==userId) {
    //       //   throw new ApolloError("This username is already taken .", "404");
    //       // }

    //       // Check is the Email address is already registred
    //       user = await User.findOne({
    //         email,
    //       });
    //       if (user && user.id !==userId ) {
    //         throw new ApolloError("Email is already registred.", "403");
    //       }

    //       // user = new User(newUser);
    //       user.username = updatedUser.username
    //       user.firstName = updatedUser.firstName
    //       user.lastName = updatedUser.lastName
    //       user.email = updatedUser.email
    //       if(updatedUser==="empty"){
    //         user.password === password
    //       }else{
    //         // Hash the user password
    //         user.password = await hash(updatedUser.password, 10);
    //       }
    //      let role = user.roles.find(a=>a.role ===updatedUser.role);
    //      if(!role){
    //       user.roles.push({role:updatedUser.role})
    //      }

    //       // Save the user to the database
    //       let result = await user.save();
    //       result = await serializeUser(result);
    //       // Issue Token
    //        await issueAuthToken(result);

    //       return {
    //         message:"Successfully update the user",
    //         success: true
    //       };
    //     } catch (err) {
    //       throw new ApolloError(err.message);
    //     }
    //   },
    /**
     * @DESC to update user detail
     * @Params userId
     * @Access Private
     */
    updateUserDetail: async (
      _,
      { userId, email, tel, firstName, lastName },
      { User }
    ) => {
      try {
        let user = await User.findById(userId);
        if (user) {
          (user.email = email), (user.tel = tel);
          user.firstName = firstName;
          user.lastName = lastName;
          await user.save();

          return {
            success: true,
            message: "User account detail updated successfully",
          };
        } else {
          return {
            success: false,
            message: "User account cannot be updated",
          };
        }
      } catch (error) {
        return {
          success: false,
          message: "User account cannot be updated",
        };
      }
    },
    /**
     * @DESC to delete the  user
     * @Params userId
     * @Access Private
     */
    deleteUser: async (_, { userId }, { User }) => {
      try {
        let user = await User.findByIdAndDelete(userId);
        if (user) {
          return {
            message: "Delete succesfully!",
            success: true,
          };
        } else {
          return {
            message: "There is no this user to delete ",
            success: false,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
      }
    },

    logoutUser: async (_, { userId }, { User,req,RefreshToken }) => {
      try {
        let user = await RefreshToken.findByOneAndDelete({user:req.user._id});
        if (user) {
          return {
            message: "Delete succesfully!",
            success: true,
          };
        } else {
          return {
            message: "There is no this user to delete ",
            success: false,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
      }
    },

    // app.post("/api/logout", verify, (req, res) => {
    //   const refreshToken = req.body.token;
    //   refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    //   res.status(200).json("You logged out successfully.");
    // });

    /**
     * @DESC to update profile image of the staff
     * @Params userId, imagelink
     * @Access Private
     */
    updateProfileImage: async (_, { userId, image }, { User }) => {
      try {
        let user = await User.findById(userId);
        if (user) {
          user.image = image;
          user.save();
          return {
            message: "Profile Image updated successfully",
            success: true,
          };
        } else {
          return {
            message: "there is no file to update profile picture",
            success: false,
          };
        }
      } catch (error) {
        return {
          message: error.message,
          success: false,
        };
      }
    },
  },
};