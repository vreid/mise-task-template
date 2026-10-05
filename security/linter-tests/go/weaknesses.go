// Package fixtures holds gosec fixtures: linted by the linter-fixture test,
// never executed.
package fixtures

import (
	"archive/zip"
	// expect: G501
	"crypto/md5"
	"crypto/sha256"
	"crypto/tls"
	"database/sql"
	"io"
	"net/http"
	"os"
)

// Query covers CWE-89: SQL built from input, and a parameterized query.
func Query(db *sql.DB) error {
	name := os.Getenv("NAME")
	// expect: G202, G701
	rows, err := db.Query("SELECT * FROM users WHERE name = '" + name + "'")
	if err != nil {
		return err
	}
	_ = rows.Close()
	// ok: G202, G701
	rows, err = db.Query("SELECT * FROM users WHERE name = ?", name)
	if err != nil {
		return err
	}
	return rows.Close()
}

// Read covers CWE-22: a path taken from input.
func Read() ([]byte, error) {
	// expect: G703
	return os.ReadFile(os.Getenv("FILE"))
}

// Fetch covers CWE-918: a request to a URL taken from input.
func Fetch() (*http.Response, error) {
	// expect: G704
	return http.Get(os.Getenv("URL"))
}

// Hash covers A04: a weak and a strong hash.
func Hash(data []byte) ([16]byte, [32]byte) {
	// expect: G401
	weak := md5.Sum(data)
	// ok: G401
	return weak, sha256.Sum256(data)
}

// Client covers A02: disabled certificate verification.
func Client() *http.Client {
	// expect: G402
	config := &tls.Config{InsecureSkipVerify: true}
	return &http.Client{Transport: &http.Transport{TLSClientConfig: config}}
}

// Unzip covers CWE-770: unbounded decompression.
func Unzip(file *zip.File, out io.Writer) error {
	reader, err := file.Open()
	if err != nil {
		return err
	}
	// expect: G110
	_, err = io.Copy(out, reader)
	return err
}
