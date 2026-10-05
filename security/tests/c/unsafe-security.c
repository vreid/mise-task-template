void checks(void) {
  // ruleid: poc.c.weak-hash
  MD5(data, length, output);
  // ok: poc.c.weak-hash
  SHA256(data, length, output);
  // ruleid: poc.c.disabled-tls
  curl_easy_setopt(handle, CURLOPT_SSL_VERIFYPEER, 0);
  // ok: poc.c.disabled-tls
  curl_easy_setopt(handle, CURLOPT_SSL_VERIFYPEER, 1);
}
