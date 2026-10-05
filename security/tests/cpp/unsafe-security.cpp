void checks(void) {
  // ruleid: poc.cpp.weak-hash
  MD5(data, length, output);
  // ok: poc.cpp.weak-hash
  SHA256(data, length, output);
  // ruleid: poc.cpp.disabled-tls
  curl_easy_setopt(handle, CURLOPT_SSL_VERIFYPEER, 0);
  // ok: poc.cpp.disabled-tls
  curl_easy_setopt(handle, CURLOPT_SSL_VERIFYPEER, 1);
}
