import bcrypt from "bcrypt";
import {compare} from "bcrypt";
import User from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import path from "path";
import{renameSync, unlinkSync,existsSync,mkdirSync} from "fs"

const maxAge = 3*24*60*60*1000;

const createToken = (email, userId) => {
  return jwt.sign({ email, userId }, process.env.JWT_KEY, 
    { expiresIn: maxAge });
};
 
export const signup = async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and Password is required");
    }
    
    const user = await User.create({ email, password});
    // console.log("Hashed Password:", user.password);
    response.cookie("jwt",createToken(email, user.id), {
      maxAge,
      secure: true,
      sameSite: "None",
    });

    return response.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
      },
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
};

export const login = async (request, response, next) => {
  try {
    const {email, password } = request.body;
    if (!email || !password) {
      return response.status(400).send("Email and Password is required");
    }
    const user = await User.findOne({email});
    if(!user){
      return response.status(404).send("User with given email not found");
    }

    // console.log("Login Password:", password);
    // console.log("Stored Hashed Password:", user.password);

    const auth=await compare(password, user.password);
    if(!auth){
      return response.status(400).send("Password is incorrect")
    }
   
     response.cookie("jwt", createToken(email, user.id), {
       maxAge,
       secure: true,
       sameSite: "None",
     });

    return response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profileSetup: user.profileSetup,
        firstName:user.firstName,
        lastName:user.lastName,
        image:user.image,
        color:user.color,
      },
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
};

export const getUserInfo=async (request, response, next) => {
  try {
 const userData= await User.findById(request.userId);
 if(!userData){
  return response.status(404).send("User with the given email not found")
 }
    return response.status(200).json({
      
        id: userData.id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName:userData.firstName,
        lastName:userData.lastName,
        image:userData.image,
        color:userData.color,
 
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
};


export const updateProfile=async (request, response, next) => {
  try {
 const {userId} =request;
 const{firstName, lastName, color}=request.body;
 if(!firstName|| !lastName){
  return response.status(400).send("Firstname Lastname and Color is required")
 }

 const userData= await User.findByIdAndUpdate(userId,
  {
    firstName,lastName,color,profileSetup:true,
  },
  {
    new:true, runValidators:true
  }
 )
    return response.status(200).json({
      
        id: userData.id,
        email: userData.email,
        profileSetup: userData.profileSetup,
        firstName:userData.firstName,
        lastName:userData.lastName,
        image:userData.image,
        color:userData.color,
 
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
}

export const addProfileImage=async (request, response, next) => {
  try {
 if(!request.file){
  return response.status(400).send("File is required")
 }
 const uploadDir = path.join("uploads", "profiles");
 if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// ***********
 const date=Date.now();
// let fileName="uploads/profiles/"+ date+ request.file.originalname;
const fileExtension = path.extname(request.file.originalname); 
    const fileName = path.join(uploadDir, `${date}${fileExtension}`);
renameSync(request.file.path, fileName);

const updatedUser= await User.findByIdAndUpdate(
  request.userId,
  {image:fileName},
  {new:true, runValidators:true}
);

    return response.status(200).json({
       image:updatedUser.image,
    });
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
}



export const removeProfileImage=async (request, response, next) => {
  try {
 const {userId} =request;
  const user=await User.findById(userId);

  if(!user){
    return response.status(404).send("User not found")
  }
// *******existsSync
  if(user.image ){
   
    unlinkSync(user.image)
  }
  
  user.image=null;
  await user.save();

    return response.status(200).send("Profile image removed successfully");
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
}

export const logout=async (request, response, next) => {
  try {
 response.cookie("jwt","",{maxAge:1, secure:true ,sameSite:'None'})
    return response.status(200).send("Logout Successfull");
  } catch (error) {
    console.error({ error });
    return response.status(500).send("Internal Sever error");
  }
}