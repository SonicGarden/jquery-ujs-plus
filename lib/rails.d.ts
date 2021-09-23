declare global {
    interface JQueryStatic {
        rails: any;
    }
}
export default function jqueryUjsPlusInit($: JQueryStatic): void;
