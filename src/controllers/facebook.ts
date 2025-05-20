import { Request, Response } from "express";
import axios from "axios";
import { FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN } from "../secrets";

export const getFacebookPosts = async (req: Request, res: Response) => {
  try {
    const fields = "message,created_time,full_picture,permalink_url";
    const url = `https://graph.facebook.com/v22.0/${FB_PAGE_ID}/posts?fields=${fields}&access_token=${FB_PAGE_ACCESS_TOKEN}`;

    const response = await axios.get(url);
    res.json(response.data); // Return Facebook posts
  } catch (error) {
    console.error("Failed to fetch Facebook posts:", error.response?.data || error);
    res.status(500).json({ error: "Failed to fetch Facebook posts" });
  }
};
