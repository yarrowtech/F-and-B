import Note from "../models/Note.model.js";

/* CREATE NOTE */

export const createNote = async (req, res) => {
  try {

    const note = new Note({
      userId: req.user.id,
      note: req.body.note
    });

    await note.save();

    res.status(201).json(note);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* GET ALL NOTES */

export const getNotes = async (req, res) => {
  try {

    const notes = await Note.find({
      userId: req.user.id
    }).sort({ isPinned: -1, date: -1 });

    res.json(notes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* SEARCH BY WORD */

export const searchNotes = async (req, res) => {
  try {

    const { word } = req.query;

    const notes = await Note.find({
      userId: req.user.id,
      $text: { $search: word }
    });

    res.json(notes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* SEARCH BY DATE */

export const getNotesByDate = async (req, res) => {
  try {

    const { date } = req.params;

    const start = new Date(date);
    const end = new Date(date);

    end.setHours(23,59,59,999);

    const notes = await Note.find({
      userId: req.user.id,
      date: { $gte: start, $lte: end }
    });

    res.json(notes);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* PIN / UNPIN NOTE */

export const togglePin = async (req, res) => {
  try {

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    note.isPinned = !note.isPinned;

    await note.save();

    res.json(note);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* DELETE NOTE */

export const deleteNote = async (req, res) => {
  try {

    await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    res.json({ message: "Note deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};