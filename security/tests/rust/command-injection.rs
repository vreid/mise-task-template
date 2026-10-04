// Opengrep fixtures: parsed as source, never executed.
use std::env;
use std::io;
use std::process::{Command, ExitStatus};

fn vulnerable() -> io::Result<ExitStatus> {
    let input = env::var("DEMO_INPUT").unwrap_or_default();
    let command = "printf '%s\\n' ".to_owned() + &input;
    // ruleid: poc.rust.environment-to-shell
    Command::new("/bin/sh").arg("-c").arg(command).status()
}

fn safe_arguments() -> io::Result<ExitStatus> {
    let input = env::var("DEMO_INPUT").unwrap_or_default();
    // ok: poc.rust.environment-to-shell
    Command::new("/usr/bin/printf")
        .arg("%s\n")
        .arg(input)
        .status()
}

fn constant_command() -> io::Result<ExitStatus> {
    // ok: poc.rust.environment-to-shell
    Command::new("/bin/sh")
        .arg("-c")
        .arg("printf fixed")
        .status()
}
