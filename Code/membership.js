// membership.js

// Initialize Firebase (ensure firebase-app, firebase-auth, and firebase-firestore scripts are included)
const auth = firebase.auth();
const db = firebase.firestore();

// Get all join buttons
const joinButtons = document.querySelectorAll(".join-btn");

// Check if user is logged in
auth.onAuthStateChanged(user => {
    if (user) {
        // Load current membership from Firestore
        const userRef = db.collection("users").doc(user.uid);
        userRef.get().then(doc => {
            if (doc.exists) {
                const data = doc.data();
                const membership = data.membership || "None";

                // Highlight user's current membership plan
                joinButtons.forEach(btn => {
                    const plan = btn.closest(".plan").querySelector("h2").innerText;
                    if (plan === membership) {
                        btn.innerText = "Current Plan";
                        btn.disabled = true;
                        btn.classList.add("current-plan");
                    }
                });
            }
        });
    } else {
        // Redirect to login if not logged in
        window.location.href = "login.html";
    }
});

// Handle membership selection
joinButtons.forEach(button => {
    button.addEventListener("click", async () => {
        const planName = button.closest(".plan").querySelector("h2").innerText;
        const user = auth.currentUser;

        if (!user) {
            alert("You must be logged in to join a plan.");
            return;
        }

        try {
            // Update membership in Firestore
            await db.collection("users").doc(user.uid).set({ membership: planName }, { merge: true });
            alert(`You have successfully joined the ${planName} plan!`);
            window.location.reload(); // Refresh to update buttons
        } catch (error) {
            console.error("Error updating membership:", error);
            alert("Failed to update membership: " + error.message);
        }
    });
});
