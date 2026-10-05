# Copyright 2026 mise-task-template contributors.
"""Ruff fixtures: parsed by the linter-fixture test, never executed."""

import hashlib
import os
import pickle
import sqlite3
import urllib.request

import requests


def sql(connection: sqlite3.Connection) -> None:
    """CWE-89: SQL built from input, and the parameterized alternative."""
    name = os.environ["NAME"]
    # expect: S608
    connection.execute("SELECT * FROM users WHERE name = '" + name + "'")
    # ok: S608
    connection.execute("SELECT * FROM users WHERE name = ?", (name,))


def code() -> None:
    """CWE-94: evaluating input as code."""
    source = os.environ["CODE"]
    # expect: S307
    eval(source)
    # expect: S102
    exec(source)


def deserialization(data: bytes) -> object:
    """CWE-502: unpickling untrusted data."""
    # expect: S301
    return pickle.loads(data)


def network() -> None:
    """CWE-918, CWE-770, A02, A04: requests, URLs, TLS, and hashing."""
    url = os.environ["URL"]
    # expect: S310
    urllib.request.urlopen(url)
    # expect: S113
    requests.get(url)
    # expect: S501
    requests.get(url, verify=False, timeout=5)
    # ok: S113, S501
    requests.get(url, timeout=5)
    # expect: S324
    hashlib.md5(url.encode())
    # ok: S324
    hashlib.sha256(url.encode())
