import User from '../models/index.js'
import { signToken, AuthenticationError } from '../utils/auth.js'

interface LoginUserArgs {
    email: string;
    password: string;
}

interface AddUserArgs {
    input: {
        username: string;
        email: string;
        password: string;
    }
}

interface SaveBookArgs {
    input:{
        bookId: String
        authors: [String]
        description: String
        title: String
        image: String
        link: String
    }
}

interface RemoveBookArgs {
    bookId: string
}

const resolvers = {
    Query: {
        me: async (_parent: any, _args: any, context: any) => {
            if (context.user) {
                return User.findOne({_id: context.user._id}).populate('savedBooks')
            }
            throw new AuthenticationError('Could not authenticate user.');
        }
    },
    Mutation: {
        login: async (_parent: any, { email, password }: LoginUserArgs) => {
            const user = await User.findOne({ email })

            // If no user is found, throw an AuthenticationError
            if (!user) {
                throw new AuthenticationError('Could not authenticate user.');
            }

            // Check if the provided password is correct
            const correctPw = await user.isCorrectPassword(password);

            // If the password is incorrect, throw an AuthenticationError
            if (!correctPw) {
                throw new AuthenticationError('Could not authenticate user.');
            }

            // Sign a token with the user's information
            const token = signToken(user.username, user.email, user._id);

            // Return the token and the user
            return { token, user };
        },

        addUser: async (_parent: any, { input }: AddUserArgs) => {
            // Create a new user with the provided username, email, and password
            const user = await User.create({ ...input });
          
            // Sign a token with the user's information
            const token = signToken(user.username, user.email, user._id);
          
            // Return the token and the user
            return { token, user };
        },
// Maybe?? - addToSet, return statement, also Args/input/input
        saveBook: async (_parent: any, { input }: SaveBookArgs, context: any) => {
            if (context.user) {
      
              await User.findOneAndUpdate(
                { _id: context.user._id },
                { $addToSet: { savedBooks: input } }
              );
      
              return context.user;
            }
            throw AuthenticationError;
            ('You need to be logged in!');
        },
// will this work even though it only pulls the id?  what about other inputs added from above?
        removeBook: async (_parent: any, { bookId }: RemoveBookArgs, context: any) => {
            if (context.user) {
              return User.findOneAndUpdate(
                { _id: context.user._id },
                {
                  $pull: {
                    savedBooks: {
                      _id: bookId,
                    },
                  },
                },
                { new: true }
              );
            }
            throw AuthenticationError;
          },
    },
};

export default resolvers;