using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;
using Org.BouncyCastle.OpenSsl;
using System.IO;
using System.Text;

namespace Dota2TranslatePTBR.Services;

public static class SignatureVerifier
{
    public static bool Verify(string canonicalManifest, string signatureBase64, string publicKeyPem)
    {
        using var reader = new PemReader(new StringReader(publicKeyPem));
        if (reader.ReadObject() is not Ed25519PublicKeyParameters key) return false;
        var signature = Convert.FromBase64String(signatureBase64);
        var message = Encoding.UTF8.GetBytes(canonicalManifest);
        var verifier = new Ed25519Signer();
        verifier.Init(false, key);
        verifier.BlockUpdate(message, 0, message.Length);
        return verifier.VerifySignature(signature);
    }
}
