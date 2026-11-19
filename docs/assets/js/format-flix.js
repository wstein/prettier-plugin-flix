import { format } from "prettier/standalone";
import flix from "prettier-plugin-flix";

export function formatFlix(source, options) {
    return format(source, { ...options, parser: "flix", plugins: [flix] });
}
