"use server";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";

// Store user details after Clerk signup
export async function storeUserDetails(clerkId: string, email: string) {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const response = await sql`
      INSERT INTO users (clerk_id, email) 
      VALUES (${clerkId}, ${email}) 
      RETURNING *`;
    console.log("User stored:", response);
    return response;
  } catch (error) {
    console.error("Error storing user:", error);
    throw error;
  }
}

// Get user details by email
export async function getUserDetails(email: string) {
  const sql = neon(process.env.DATABASE_URL!);
  const response = await sql`
    SELECT * FROM users 
    WHERE email = ${email}`;
  console.log("User details:", response);
  return response;
}

// Get all users
export async function getAllUsers() {
  const sql = neon(process.env.DATABASE_URL!);
  const response = await sql`
    SELECT * FROM users`;
  return response;
}

// Update user profile
export async function updateUserProfile(
  clerkId: string,
  data: {
    username: string;
    email: string;
    phone: string;
    walletAddress: string;
  }
) {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    // First check if user exists
    const user = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;
    console.log("Existing user:", user);

    if (user.length === 0) {
      // Insert new user if doesn't exist
      const response = await sql`
        INSERT INTO users (clerk_id, username, email, phone, wallet_address)
        VALUES (${clerkId}, ${data.username}, ${data.email}, ${data.phone}, ${data.walletAddress})
        RETURNING *
      `;
      console.log("New user created:", response);
      return response;
    } else {
      // Update existing user
      const response = await sql`
        UPDATE users 
        SET 
          username = ${data.username},
          phone = ${data.phone},
          wallet_address = ${data.walletAddress}
        WHERE clerk_id = ${clerkId}
        RETURNING *
      `;
      console.log("User updated:", response);
      return response;
    }
  } catch (error) {
    console.error("Error managing profile:", error);
    throw error;
  }
}