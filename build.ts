
import fs from "fs/promises"

const entrypoint = "src/index.ts"
await fs.rm("dist",{force:true,recursive:true})

const proc = Bun.spawn({
    cmd: [
        "bunx","tsc",
        "--declaration", "--emitDeclarationOnly",
        "--skipLibCheck", "true",
        "--outDir", "dist",
        entrypoint
    ],
    stdout: "inherit",
    stdin: "inherit"
})

await proc.exited

const output = await Bun.build({
    entrypoints: [entrypoint],
    outdir: "dist",
    target: "browser",
    packages: "external"
})

if(!output.success) {
    console.error(output.logs)
    throw new Error("打包失败")
}

console.log("打包成功 ✅")
