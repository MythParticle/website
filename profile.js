// profile.js

// Initialize Firebase (make sure you have firebase-app, firebase-auth, firebase-firestore, firebase-storage scripts in HTML)
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const profilePicInput = document.getElementById("profilePic");
const profileImage = document.getElementById("profileImage");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const membershipSelect = document.getElementById("membership");
const editProfileForm = document.getElementById("editProfileForm");

// Check if user is logged in
auth.onAuthStateChanged(async (user) => {
    if (user) {
        emailInput.value = user.email;

        const userRef = db.collection("users").doc(user.uid);
        const doc = await userRef.get();

        if (doc.exists) {
            const data = doc.data();
            nameInput.value = data.name || "";
            membershipSelect.value = data.membership || "Standard Member";
            if (data.photoURL) profileImage.src = data.photoURL;

            // Update profile card dynamically
            const profileCard = document.querySelector(".profile-card .profile-info");
            if (profileCard) {
                profileCard.innerHTML = `
                    <p><strong>Name:</strong> ${data.name || "Your Name"}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Membership:</strong> ${data.membership || "Standard Member"}</p>
                    <p><strong>Joined:</strong> ${data.joined || "Date not set"}</p>
                `;
            }
        } else {
            // Create default profile document if it doesn't exist
            await userRef.set({
                name: "",
                membership: "Standard Member",
                joined: new Date().toLocaleDateString()
            });
        }
    } else {
        window.location.href = "login.html";
    }
});

// Handle profile picture preview
profilePicInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        profileImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Handle form submission
editProfileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const newName = nameInput.value;
    const newEmail = emailInput.value;
    const newPassword = passwordInput.value;
    const newMembership = membershipSelect.value;

    try {
        const userRef = db.collection("users").doc(user.uid);

        // Update Firestore: name & membership
        await userRef.set({ 
            name: newName, 
            membership: newMembership 
        }, { merge: true });

        // Update email if changed
        if (newEmail !== user.email) {
            await user.updateEmail(newEmail);
        }

        // Update password if provided
        if (newPassword) {
            await user.updatePassword(newPassword);
        }

        // Upload profile picture if selected
        if (profilePicInput.files.length > 0) {
            const file = profilePicInput.files[0];
            const storageRef = firebase.storage().ref();
            const profileRef = storageRef.child(`profilePics/${user.uid}/${file.name}`);
            await profileRef.put(file);
            const photoURL = await profileRef.getDownloadURL();
            await userRef.set({ photoURL }, { merge: true });
            profileImage.src = photoURL;
        }

        // Refresh profile card dynamically
        const updatedDoc = await userRef.get();
        const data = updatedDoc.data();
        const profileCard = document.querySelector(".profile-card .profile-info");
        if (profileCard) {
            profileCard.innerHTML = `
                <p><strong>Name:</strong> ${data.name || "Your Name"}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Membership:</strong> ${data.membership || "Standard Member"}</p>
                <p><strong>Joined:</strong> ${data.joined || "Date not set"}</p>
            `;
        }

        alert("Profile updated successfully!");
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile: " + error.message);
    }
});


