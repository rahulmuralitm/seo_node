const express = require('express');
const cors = require('cors');
const scanRoutes = require('./routes/scan');
const chatbotRoutes = require('./routes/chatbot');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/scan', scanRoutes);
app.use('/api/chatbot', chatbotRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
