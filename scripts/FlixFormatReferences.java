import ca.uwaterloo.flix.api.Flix;
import ca.uwaterloo.flix.api.Version;
import ca.uwaterloo.flix.api.lsp.FormatterLsp;
import ca.uwaterloo.flix.language.CompilationMessage;
import ca.uwaterloo.flix.language.ast.shared.SecurityContext;
import ca.uwaterloo.flix.language.ast.shared.SourceName;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import scala.collection.immutable.List$;
import scala.collection.immutable.Map$;
import scala.jdk.javaapi.CollectionConverters;

public class FlixFormatReferences {
    public static void main(String[] args) throws Exception {
        String version = Version.CurrentVersion().toString();
        if (!version.equals(args[0])) {
            throw new IllegalArgumentException("Expected Flix " + args[0] + ", got " + version);
        }
        // Scala's nested object is exposed as a JVM singleton.
        var context = (SecurityContext) Class.forName(SecurityContext.class.getName() + "$Unrestricted$")
            .getField("MODULE$").get(null);
        for (String arg : List.of(args).subList(1, args.length)) {
            var file = Path.of(arg);
            try {
                if (check(file, context, "input-diagnostics.txt", true)) {
                    check(file, context, "output-diagnostics.txt", false);
                }
            } catch (Throwable error) {
                // An internal compiler crash must not hide the other fixtures; the Node side reports it.
                var trace = new StringWriter();
                error.printStackTrace(new PrintWriter(trace));
                Files.writeString(file.resolveSibling("crash.txt"), trace.toString());
            }
        }
    }

    private static boolean check(Path file, SecurityContext context, String diagnosticsName, boolean format) throws Exception {
        try (var flix = new Flix(List$.MODULE$.empty(), List$.MODULE$.empty(), Map$.MODULE$.empty())) {
            flix.addFile(file, context);
            var checked = flix.check();
            if (!checked._2().isEmpty()) {
                var diagnostics = CompilationMessage.formatAll(checked._2(), flix.getFormatter(), checked._1());
                Files.writeString(file.resolveSibling(diagnosticsName), diagnostics);
                return false;
            }
            if (format) {
                // `formatFiles` silently writes nothing when it finds no tree for the path or the
                // pretty printer returns nothing, which would record the unchanged input as Flix's
                // output. `format` runs the same lookup and printer and exposes whether it succeeded.
                var name = new SourceName.PathName(file.normalize());
                if (FormatterLsp.format(flix.getParsedAst(), name).isEmpty()) {
                    throw new IllegalStateException("The Flix formatter produced no output for " + file);
                }
                // Same formatter and type-check gate as the explicit-file `flix format` command.
                FormatterLsp.formatFiles(flix.getParsedAst(), CollectionConverters.asScala(List.of(file)).toList(), flix);
            }
            return true;
        }
    }
}
