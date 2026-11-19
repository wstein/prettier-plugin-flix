import ca.uwaterloo.flix.api.Flix;
import ca.uwaterloo.flix.api.Version;
import ca.uwaterloo.flix.api.lsp.FormatterLsp;
import ca.uwaterloo.flix.language.CompilationMessage;
import ca.uwaterloo.flix.language.ast.shared.SecurityContext;
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
            try (var flix = new Flix(List$.MODULE$.empty(), List$.MODULE$.empty(), Map$.MODULE$.empty())) {
                flix.addFile(file, context);
                var checked = flix.check();
                if (checked._2().isEmpty()) {
                    // Same formatter and type-check gate as the explicit-file `flix format` command.
                    FormatterLsp.formatFiles(flix.getParsedAst(), CollectionConverters.asScala(List.of(file)).toList(), flix);
                } else {
                    var diagnostics = CompilationMessage.formatAll(checked._2(), flix.getFormatter(), checked._1());
                    Files.writeString(file.resolveSibling("diagnostics.txt"), diagnostics);
                }
            }
        }
    }
}
