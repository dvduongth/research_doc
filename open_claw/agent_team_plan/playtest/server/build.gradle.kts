plugins {
    kotlin("jvm") version "2.3.0"
    kotlin("plugin.serialization") version "2.3.0"
    application
}

group = "playtest"
version = "1.0.0"

repositories {
    mavenCentral()
}

val ktorVersion = "3.4.0"
val coroutinesVersion = "1.9.0"
val serializationVersion = "1.7.3"

dependencies {
    implementation("io.ktor:ktor-server-core:$ktorVersion")
    implementation("io.ktor:ktor-server-netty:$ktorVersion")
    implementation("io.ktor:ktor-server-websockets:$ktorVersion")
    implementation("io.ktor:ktor-server-content-negotiation:$ktorVersion")
    implementation("io.ktor:ktor-serialization-kotlinx-json:$ktorVersion")
    implementation("io.ktor:ktor-server-cors:$ktorVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:$coroutinesVersion")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:$serializationVersion")
    implementation("ch.qos.logback:logback-classic:1.4.14")
}

application {
    mainClass.set("playtest.MainKt")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(17))
    }
}
