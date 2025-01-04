const express = require('express');
const path = require('path');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ownerRoutes = require('./routes/ownerRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Session management
app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use((err, req, res, next) => {
    console.error(err.stack);  // Log the error stack
    res.status(500).send('Something went wrong!');
});


// Landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html')); 
});

// Routes
app.use('/auth', authRoutes);
app.use('/customers', customerRoutes);
app.use('/owner', ownerRoutes);


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
