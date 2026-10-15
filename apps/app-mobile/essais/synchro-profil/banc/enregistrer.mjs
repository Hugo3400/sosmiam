// À donner à node (--import, voir lancer.mjs) : branche les crochets du banc avant le premier essai
import { register } from "node:module";

register("./crochets.mjs", import.meta.url);
