import express from "express";
import auth from "../middlewares/auth.middleware.js";

import {
  createNote,
  getNotes,
  searchNotes,
  getNotesByDate,
  togglePin,
  updateNote,
  deleteNote
} from "../controllers/note.controller.js";

const router = express.Router();

router.post("/", auth, createNote);

router.get("/", auth, getNotes);

router.get("/search", auth, searchNotes);

router.get("/date/:date", auth, getNotesByDate);

router.patch("/pin/:id", auth, togglePin);

router.put("/:id", auth, updateNote);

router.delete("/:id", auth, deleteNote);

export default router;
