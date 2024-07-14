const {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendEmailVerification,
    sendPasswordResetEmail,
    db
} = require('../config/firebase');

const auth = getAuth();
import { jsPDF } from 'jspdf';

//no futuro tem que ir para o user-controller.js
class UserResumeEditController {

    convertUserResumeToPDF(req, res) {
        //convert user resume to pdf and download to client
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Get a reference to the user's resume document in Firestore
        const userResumeRef = db.collection('resumes').doc(user.uid);

        // Get the user's resume document from Firestore
        userResumeRef.get()
            .then((doc) => {
                if (doc.exists) {
                    const userResume = doc.data();
                    const doc = new jsPDF();
                    doc.text(userResume.name, 10, 10);
                    doc.text(userResume.email, 10, 20);
                    doc.text(userResume.phone, 10, 30);
                    doc.text(userResume.location, 10, 40);
                    doc.text(userResume.birthdate, 10, 50);
                    doc.text(userResume.gender, 10, 60);
                    doc.text(userResume.area, 10, 70);
                    doc.text(userResume.formation, 10, 80);
                    doc.text(userResume.description, 10, 90);
                    doc.save('resume.pdf');
                    res.status(200).json({ message: "User resume downloaded successfully!" });
                }});
    }

    getUserResume(req, res) {
        // Ensure the user is authenticated
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Get a reference to the user's resume document in Firestore
        const userResumeRef = db.collection('resumes').doc(user.uid);

        // Get the user's resume document from Firestore
        userResumeRef.get()
            .then((doc) => {
                if (doc.exists) {
                    const userResume = doc.data();
                    res.status(200).json(userResume);
                } else {
                    res.status(404).json({ error: "User resume not found" });
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            });
    }

    getPublicResumes(req, res) {
        db.collection('resumes').get()
            .then((snapshot) => {
                const resumes = [];
                snapshot.forEach((doc) => {
                    resumes.push(doc.data());
                });
                res.status(200).json(resumes);
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            });
    }

    updateUserResume(req, res) {
        const {
            name,
            email,
            phone,
            location,
            birthdate,
            gender,
            area,
            formation,
            description
        } = req.body;

        // Create a user resume object from the request body
        const userResume = {
            name,
            email,
            phone,
            location,
            birthdate,
            gender,
            area,
            formation,
            description
        };

        // Ensure the user is authenticated
        const user = auth.currentUser;
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Get a reference to the user's resume document in Firestore
        const userResumeRef = db.collection('resumes').doc(user.uid);

        // Set the user's resume document in Firestore
        userResumeRef.set(userResume)
            .then(() => {
                // Respond with a success message
                res.status(201).json({ message: "User resume updated successfully!" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            });
    }
}

class FirebaseAuthController {
    registerUser(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "Email is required",
                password: "Password is required",
            });
        }
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                sendEmailVerification(auth.currentUser)
                    .then(() => {
                        res.status(201).json({ message: "Verification email sent! User created successfully!" });
                    })
                    .catch((error) => {
                        console.error(error);
                        res.status(500).json({ error: "Error sending email verification" });
                    });
            })
            .catch((error) => {
                const errorMessage = error.message || "An error occurred while registering user";
                res.status(500).json({ error: errorMessage });
            });
    }

    loginUser(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(422).json({
                email: "Email is required",
                password: "Password is required",
            });
        }
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const idToken = userCredential._tokenResponse.idToken
                if (idToken) {
                    res.cookie('access_token', idToken, {
                        httpOnly: false

                    });
                    //cookie para verificar se o usuario esta logado
                    res.cookie('logged_in', true, { httpOnly: false });
                    res.status(200).json({ message: "User logged in successfully", userCredential });
                } else {
                    res.status(500).json({ error: "Internal Server Error" });
                }
            })
            .catch((error) => {
                console.error(error);
                const errorMessage = error.message || "An error occurred while logging in";
                res.status(500).json({ error: errorMessage });
            });
    }

    logoutUser(req, res) {
        signOut(auth)
            .then(() => {
                res.clearCookie('access_token');
                res.clearCookie('logged_in');
                res.status(200).json({ message: "User logged out successfully" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            });
    }

    resetPassword(req, res) {
        const { email } = req.body;
        if (!email) {
            return res.status(422).json({
                email: "Email is required"
            });
        }
        sendPasswordResetEmail(auth, email)
            .then(() => {
                res.status(200).json({ message: "Password reset email sent successfully!" });
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ error: "Internal Server Error" });
            });
    }
}

authController = new FirebaseAuthController();
resumeController = new UserResumeEditController();

module.exports = {
    authController,
    resumeController
};