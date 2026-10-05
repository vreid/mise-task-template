fn checks() {
 // ruleid: poc.rust.weak-hash
 md5::compute(b"message");
 // ok: poc.rust.weak-hash
 sha2::Sha256::digest(b"message");
 // ruleid: poc.rust.disabled-tls
 builder.danger_accept_invalid_certs(true);
 // ok: poc.rust.disabled-tls
 builder.danger_accept_invalid_certs(false);
}
