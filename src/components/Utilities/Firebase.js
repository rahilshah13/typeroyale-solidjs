import { initializeApp } from "firebase/app";
import { getAuth, signOut, getRedirectResult } from "firebase/auth";
import { GoogleAuthProvider, TwitterAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDr_-Tt8AklHVRt7fSW2WP0SJIKvs2guSc",
    authDomain: "typeroyale-cf8f6.firebaseapp.com",
    projectId: "typeroyale-cf8f6",
    storageBucket: "typeroyale-cf8f6.appspot.com",
    messagingSenderId: "371960253484",
    appId: "1:371960253484:web:072b4430ce339d5bfa5589",
    measurementId: "G-RDMFSEP2QV"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();

const log_on = (type) => {
    getRedirectResult(auth)
    .then((result) => {
        // This gives you a Google Access Token. You can use it to access Google APIs.
        var provider = null;
        if(type==="google") provider = new GoogleAuthProvider();
        else if(type==="twitter") provider = new TwitterAuthProvider();
        else if(type==="github") provider = new GithubAuthProvider();

        const credential = provider.credentialFromResult(result);
        const token = credential.accessToken;
        // The signed-in user info.
        const user = result.user;
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = provider.credentialFromError(error);
     });
}

const log_off = () => {
    signOut(auth).then(() => {
        console.log("sign out success");
        }).catch((error) => {
        console.log("sign out error", error);
    });
}
