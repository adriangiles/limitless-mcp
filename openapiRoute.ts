// Serve openapi.yaml at /openapi.yaml
import express from 'express';
import path from 'path';

const router = express.Router();

router.get('/openapi.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, '../openapi.yaml'));
});

export default router;
