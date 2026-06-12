const router = require('express').Router(); 
const Song = require('../models/Song'); 
router.get('/search', async (req, res) => { 
  const query = req.query.q; 
  try { 
    const songs = await Song.find({ $or: [{ title: { $regex: query, $options: 'i' } }, { artist: { $regex: query, $options: 'i' } }] }); 
    res.json(songs); 
  } catch (err) { res.status(500).json(err); } 
}); 
router.get('/', async (req, res) => { try { const songs = await Song.find(); res.json(songs); } catch (err) { res.status(500).json(err); } }); 
router.get('/:id', async (req, res) => { try { const song = await Song.findById(req.params.id); res.json(song); } catch (err) { res.status(500).json(err); } }); 
module.exports = router; 
