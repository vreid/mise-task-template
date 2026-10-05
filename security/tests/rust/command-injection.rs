// Opengrep fixtures: parsed as source, never executed.
use std::env;
use std::io;
use std::process::{Command, ExitStatus};

fn vulnerable() -> io::Result<ExitStatus> {
    let input = env::var("DEMO_INPUT").unwrap_or_default();
    let command = "printf '%s\\n' ".to_owned() + &input;
    // ruleid: poc.rust.input-to-shell
    Command::new("/bin/sh").arg("-c").arg(command).status()
}

fn safe_arguments() -> io::Result<ExitStatus> {
    let input = env::var("DEMO_INPUT").unwrap_or_default();
    // ok: poc.rust.input-to-shell
    Command::new("/usr/bin/printf")
        .arg("%s\n")
        .arg(input)
        .status()
}

fn constant_command() -> io::Result<ExitStatus> {
    // ok: poc.rust.input-to-shell
    Command::new("/bin/sh")
        .arg("-c")
        .arg("printf fixed")
        .status()
}

fn via_args_array() -> io::Result<ExitStatus> {
    let command = env::var("DEMO_INPUT").unwrap_or_default();
    // ruleid: poc.rust.input-to-shell
    Command::new("sh").args(["-c", &command]).status()
}

fn via_bash() -> io::Result<ExitStatus> {
    let command = env::var("DEMO_INPUT").unwrap_or_default();
    // ruleid: poc.rust.input-to-shell
    Command::new("bash").arg("-c").arg(command).status()
}

fn via_arguments() -> io::Result<ExitStatus> {
    let command = env::args().nth(1).unwrap_or_default();
    // ruleid: poc.rust.input-to-shell
    Command::new("sh").arg("-c").arg(command).status()
}

fn safe_arguments_from_argv() -> io::Result<ExitStatus> {
    let input = env::args().nth(1).unwrap_or_default();
    // ok: poc.rust.input-to-shell
    Command::new("/usr/bin/printf").args(["%s\n", &input]).status()
}
