const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());


const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/onepiece_tracker';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectat correctament a MongoDB'))
  .catch(err => console.error('Error de connexió a MongoDB:', err));

const DeckSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  leaderColors: [String],
  leaderCard: { type: Object, default: null },
  cards: { type: Array, default: [] },
  sideCards: { type: Array, default: [] }
}, { minimize: false });

const StateSchema = new mongoose.Schema({
  activeDeckId: String,
  gridZoom: Number
});

const Deck = mongoose.model('Deck', DeckSchema);
const AppState = mongoose.model('AppState', StateSchema);


app.get('/api/state', async (req, res) => {
  try {
    const decks = await Deck.find({});
    let appState = await AppState.findOne({});
    if (!appState) {
      appState = await AppState.create({ activeDeckId: null, gridZoom: 130 });
    }
    res.json({
      decks,
      activeDeckId: appState.activeDeckId,
      gridZoom: appState.gridZoom
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/state', async (req, res) => {
  try {
    const { decks, activeDeckId, gridZoom } = req.body;

    await AppState.findOneAndUpdate({}, { activeDeckId, gridZoom }, { upsert: true });

    await Deck.deleteMany({});
    if (decks && decks.length > 0) {
      await Deck.insertMany(decks);
    }

    res.json({ message: 'Estat desat correctament a MongoDB' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de l'App corrent al port ${PORT}`);
});