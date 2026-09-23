package com.example.auth

import android.content.Context
import android.util.Log
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import kotlinx.coroutines.tasks.await

data class GoogleUserData(
    val name: String,
    val email: String,
    val photoUrl: String?
)

class GoogleAuthHelper(private val context: Context) {

    private val credentialManager = CredentialManager.create(context)
    private val firebaseAuth = FirebaseAuth.getInstance()

    companion object {
        // Web Client ID from google-services.json (client_type 3)
        const val WEB_CLIENT_ID = "209240158881-c65pfjtv4g6in22l5sbtvof4k4a9j48b.apps.googleusercontent.com"
        private const val TAG = "GoogleAuthHelper"
    }

    suspend fun signInWithGoogle(): Result<GoogleUserData> {
        return try {
            val signInOption = GetSignInWithGoogleOption.Builder(serverClientId = WEB_CLIENT_ID)
                .build()

            val request = GetCredentialRequest.Builder()
                .addCredentialOption(signInOption)
                .build()

            val result = credentialManager.getCredential(
                request = request,
                context = context
            )

            val credential = result.credential
            if (credential is CustomCredential && credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                val idToken = googleIdTokenCredential.idToken

                val authCredential = GoogleAuthProvider.getCredential(idToken, null)
                val authResult = firebaseAuth.signInWithCredential(authCredential).await()
                val user = authResult.user

                val displayName = user?.displayName ?: googleIdTokenCredential.displayName ?: "Usuário Google"
                val email = user?.email ?: googleIdTokenCredential.id
                val photoUrl = user?.photoUrl?.toString() ?: googleIdTokenCredential.profilePictureUri?.toString()

                Result.success(GoogleUserData(displayName, email, photoUrl))
            } else {
                Result.failure(Exception("Tipo de credencial não suportada: ${credential.type}"))
            }
        } catch (e: GetCredentialCancellationException) {
            Log.w(TAG, "Usuário cancelou o login com Google: ${e.message}")
            Result.failure(Exception("Login cancelado pelo usuário."))
        } catch (e: Exception) {
            Log.e(TAG, "Falha no login com Google", e)
            Result.failure(e)
        }
    }
}
