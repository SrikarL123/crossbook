// Firebase configuration is loaded from config.js
// Make sure config.js is included before this script in your HTML

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database
const db = firebase.database();

// Test write to database
db.ref("testConnection").set({
  message: "Hello Firebase!"
});


// --- DATA ---
// Thriller Books
const thrillerBooks = [
    { name: "The Silent Patient", author: "Alex Michaelides", genre: "Thriller", description: "A gripping psychological thriller.", pic: "t_b1.jpeg" },
    { name: "The Teacher", author: "Freida McFadden", genre: "Thriller", description: "A suspenseful thriller full of twists.", pic: "t_b2.jpeg" },
    { name: "The Boyfriend", author: "Freida McFadden", genre: "Thriller", description: "A tense and gripping read.", pic: "t_b3.jpeg" },
    { name: "Verity", author: "Colleen Hoover", genre: "Thriller", description: "A bestselling romantic thriller.", pic: "t_b4.jpeg" }
];

// Self-Help Books (added sh_b3 and sh_b4)
const selfHelpBooks = [
    { name: "Ikigai", author: "Héctor García & Francesc Miralles", genre: "Self-Help", description: "Discover your purpose in life.", pic: "sh_b1.jpeg" },
    { name: "The Psychology of Money", author: "Morgan Housel", genre: "Self-Help", description: "Insights into financial behavior.", pic: "sh_b2.jpeg" },
    { name: "Atomic Habits", author: "James Clear", genre: "Self-Help", description: "Small habits that change your life.", pic: "sh_b3.jpg" },
    { name: "The Art of Letting Go", author: "Nick Trenton", genre: "Self-Help", description: "If you are always on edge and unable to relax, this book is for you.", pic: "sh_b4.jpg" }
];

// Romance / Love Books (added rl_b3 and rl_b4)
const romanceBooks = [
    { name: "Can First Love Be Forever?", author: "Manisha Vashist", genre: "Romance", description: "A heartwarming story of young love.", pic: "rl_b1.jpg" },
    { name: "I Too Had a Love Story", author: "Ravinder Singh", genre: "Romance", description: "A moving true love story.", pic: "rl_b2.jpeg" },
    { name: "Too Good to Be True", author: "Prajakta Koli", genre: "Romance", description: "A contemporary Indian romance novel about Avani, a romance novel enthusiast, who meets Aman, a seemingly perfect man.", pic: "rl_b3.jpg" },
    { name: "Icebreaker", author: "Hannah Grace", genre: "Romance", description: "A college romance novel between a skater and a hockey player.", pic: "rl_b4.jpg" }
];


// --- GLOBAL ---
let currentUser = "";

// --- LOGIN & UI ---
const signInBtn = document.getElementById("signInBtn");
const nameInput = document.getElementById("nameInput");
const userNameDisplay = document.getElementById("userName");

signInBtn.addEventListener("click", () => {
    const userName = nameInput.value.trim();
    if (userName) {
        currentUser = userName;
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("homePage").classList.remove("hidden");
        userNameDisplay.textContent = userName;

        // ✅ Show buttons after login
        document.getElementById("logoutBtn").classList.remove("hidden");

        // Ensure user exists in Firebase
        db.ref("users/" + currentUser).once("value", snapshot => {
            if (!snapshot.exists()) {
                db.ref("users/" + currentUser).set({ likes: [], dislikes: [] });
            }
        });

        displayAllSections();
    } else {
        alert("Please enter your name");
    }
});

nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") signInBtn.click();
});

function displayBooksInGrid(bookArr, gridId) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = "";
    bookArr.forEach((book) => {
        const bookCard = document.createElement("div");
        bookCard.classList.add("book-card");
        bookCard.innerHTML = `
            <img src="${book.pic}" alt="${book.name}" onerror="this.onerror=null; this.src='default.jpeg';">
            <h3>${book.name}</h3>
        `;
        bookCard.addEventListener("click", () => showBookDetails(book));
        grid.appendChild(bookCard);
    });
}

function displayAllSections() {
    displayBooksInGrid(thrillerBooks, "thrillerBooksGrid");
    displayBooksInGrid(selfHelpBooks, "selfHelpBooksGrid");
    displayBooksInGrid(romanceBooks, "romanceBooksGrid");
}

// --- RECOMMENDATIONS ---
function showRecommendations() {
    const recSection = document.getElementById("recommendationsSection");
    const recGrid = document.getElementById("recommendationsGrid");
    recGrid.innerHTML = "";

    // Get liked books from Firebase
    db.ref("users/" + currentUser + "/likes").once("value").then(snapshot => {
        const likedBooks = snapshot.val() || [];

        if (likedBooks.length === 0) {
            recSection.classList.add("hidden");
            return;
        }

        const allBooks = [...thrillerBooks, ...selfHelpBooks, ...romanceBooks];
        let recommendations = [];

        likedBooks.forEach(likedName => {
            const likedBook = allBooks.find(b => b.name === likedName);
            if (!likedBook) return;

            // --- Genre-based (2 random) ---
            let genreBooks = allBooks.filter(b => b.genre === likedBook.genre && b.name !== likedBook.name);
            shuffleArray(genreBooks); // randomize
            recommendations.push(...genreBooks.slice(0, 2));

            // --- Author-based (2 random) ---
            let authorBooks = allBooks.filter(b => b.author === likedBook.author && b.name !== likedBook.name);
            shuffleArray(authorBooks);
            recommendations.push(...authorBooks.slice(0, 2));
        });

        // Remove duplicates
        recommendations = recommendations.filter((book, index, self) =>
            index === self.findIndex(b => b.name === book.name)
        );

        if (recommendations.length === 0) {
            recSection.classList.add("hidden");
            return;
        }

        recSection.classList.remove("hidden");

        recommendations.forEach(book => {
            const bookCard = document.createElement("div");
            bookCard.classList.add("book-card");
            bookCard.innerHTML = `
                <img src="${book.pic}" alt="${book.name}" onerror="this.onerror=null; this.src='default.jpeg';">
                <h3>${book.name}</h3>
            `;
            bookCard.addEventListener("click", () => showBookDetails(book));
            recGrid.appendChild(bookCard);
        });
    });
}

// --- Helper: shuffle array ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


// --- SCROLLABLE RECOMMENDATIONS ---
const recGrid = document.getElementById("recommendationsGrid");
const scrollRightBtn = document.getElementById("scrollRight");
const scrollLeftBtn = document.getElementById("scrollLeft");

if (scrollRightBtn && recGrid) {
    scrollRightBtn.addEventListener("click", () => {
        recGrid.scrollBy({ left: 200, behavior: 'smooth' });
    });
}

if (scrollLeftBtn && recGrid) {
    scrollLeftBtn.addEventListener("click", () => {
        recGrid.scrollBy({ left: -200, behavior: 'smooth' });
    });
}



// --- SAVE LIKE/DISLIKE TO FIREBASE ---
function updateFirebaseVote(voteType, bookName) {
    if (!currentUser) return;

    const listRef = db.ref(`users/${currentUser}/${voteType}s`);

    listRef.once("value").then(snapshot => {
        let books = snapshot.val() || [];

        // Avoid duplicates
        if (!books.includes(bookName)) {
            books.push(bookName);
        }

        // Remove from the opposite list
        const oppositeType = voteType === "like" ? "dislike" : "like";
        const oppositeRef = db.ref(`users/${currentUser}/${oppositeType}s`);
        oppositeRef.once("value").then(oppSnap => {
            let oppBooks = oppSnap.val() || [];
            oppBooks = oppBooks.filter(b => b !== bookName);

            // Save both lists
            db.ref(`users/${currentUser}`).update({
                [`${voteType}s`]: books,
                [`${oppositeType}s`]: oppBooks
            }).then(() => {
                // ✅ Only refresh recommendations AFTER saving Like
                if (voteType === "like") {
                    showRecommendations();
                }
            });
        });
    });
}

// --- MODAL ---
const bookDetailsModal = document.getElementById("bookDetailsModal");
const closeModal = document.getElementById("closeModal");

function showBookDetails(book) {
    const bookImage = document.getElementById("bookPic");
    bookImage.src = book.pic;
    bookImage.onerror = function () {
        this.onerror = null;
        this.src = "default.jpeg";
    };
    document.getElementById("bookName").textContent = book.name;
    document.getElementById("bookAuthor").textContent = "Author: " + book.author;
    document.getElementById("bookDescription").textContent = "Description: " + book.description;

    if (typeof book.likes !== "number") book.likes = 0;
    if (typeof book.dislikes !== "number") book.dislikes = 0;
    if (typeof book.userVote === "undefined") book.userVote = null;

    document.getElementById("likeCount").textContent = book.likes;
    document.getElementById("dislikeCount").textContent = book.dislikes;

    // ❌ Removed: showRecommendations(book);

    const likeBtn = document.getElementById("likeButton").cloneNode(true);
    const dislikeBtn = document.getElementById("dislikeButton").cloneNode(true);
    document.getElementById("likeButton").replaceWith(likeBtn);
    document.getElementById("dislikeButton").replaceWith(dislikeBtn);

    likeBtn.onclick = () => {
        if (book.userVote === "like") return;
        if (book.userVote === "dislike") book.dislikes--;
        book.likes++;
        book.userVote = "like";

        document.getElementById("likeCount").textContent = book.likes;
        document.getElementById("dislikeCount").textContent = book.dislikes;

        updateFirebaseVote("like", book.name);

        // ✅ Only show recommendations after Like
        showRecommendations();
    };

    dislikeBtn.onclick = () => {
        if (book.userVote === "dislike") return;
        if (book.userVote === "like") book.likes--;
        book.dislikes++;
        book.userVote = "dislike";

        document.getElementById("likeCount").textContent = book.likes;
        document.getElementById("dislikeCount").textContent = book.dislikes;

        updateFirebaseVote("dislike", book.name);

        // ❌ Hide recommendations on Dislike
        document.getElementById("recommendationsSection").classList.add("hidden");
    };

    bookDetailsModal.classList.remove("hidden");
}


closeModal.addEventListener("click", () => {
    bookDetailsModal.classList.add("hidden");
});

bookDetailsModal.addEventListener("click", function (e) {
    if (e.target === bookDetailsModal) {
        bookDetailsModal.classList.add("hidden");
    }
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !bookDetailsModal.classList.contains("hidden")) {
        bookDetailsModal.classList.add("hidden");
    }
});


// --- LOGOUT BUTTON ---
document.getElementById("logoutBtn").addEventListener("click", () => {
    currentUser = "";
    document.getElementById("homePage").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    nameInput.value = "";

    // ✅ Hide buttons after logout
    document.getElementById("logoutBtn").classList.add("hidden");
});


// --- DARK MODE TOGGLE ---
const darkModeBtn = document.getElementById("darkModeBtn");
let darkMode = false;

darkModeBtn.addEventListener("click", () => {
    darkMode = !darkMode;
    document.body.classList.toggle("dark-mode", darkMode);
    darkModeBtn.textContent = darkMode ? "☀️" : "🌙";
});

