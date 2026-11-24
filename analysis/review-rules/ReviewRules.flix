/// Opt-in prototype: advisory formatter-review rules as Flix Datalog (#209).
///
/// Predicates (no separate `rel` declarations in Flix 0.80):
///   SweepFail(id, width)       — sweep case with status=fail
///   SweepSkip(id, width)       — skipped case (never a finding)
///   KnownException(id)         — known-failure case id
///   LayoutChange(name, digest) — official-example layout change
///   Approval(name, digest)     — approval for that digest
///   Finding(rule, subject, evidence)
///
/// Run via `npm run review:rules`. Not a release gate.

/// Rule R1: fail at width >= 40 without a known exception.
/// Rule R2: layout change whose current digest has no matching approval.
def rules(): #{
    SweepFail(String, Int32),
    SweepSkip(String, Int32),
    KnownException(String),
    LayoutChange(String, String),
    Approval(String, String),
    Finding(String, String, String) | r
} = #{
    Finding("R1-fail-without-exception", id, "width=${w}") :-
        SweepFail(id, w),
        if (w >= 40),
        not KnownException(id).

    Finding("R2-layout-unapproved", name, digest) :-
        LayoutChange(name, digest),
        not Approval(name, digest).
}

/// Evaluate the two rules over injected fact lists.
def evaluate(
    fails: List[(String, Int32)],
    skips: List[(String, Int32)],
    known: List[String],
    layouts: List[(String, String)],
    approvals: List[(String, String)]
): List[(String, String, String)] =
    let f = inject fails into SweepFail/2;
    let s = inject skips into SweepSkip/2;
    let k = inject known into KnownException/1;
    let l = inject layouts into LayoutChange/2;
    let a = inject approvals into Approval/2;
    let rows = query f, s, k, l, a, rules()
        select (rule, subject, evidence) from Finding(rule, subject, evidence);
    // Sort in Node for a stable Comparison API across Flix versions; return as List.
    Vector.toList(rows)

/// Escape tabs/newlines so FINDING TSV lines round-trip (kept in sync with lib.mjs).
def escapeFindingField(s: String): String =
    s |> String.replace(src = "\\", dst = "\\\\")
      |> String.replace(src = "\n", dst = "\\n")
      |> String.replace(src = "\r", dst = "\\r")
      |> String.replace(src = "\t", dst = "\\t")
