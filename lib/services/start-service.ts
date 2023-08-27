import { ChildProcess } from "child_process";
import { IChildProcess } from "../common/declarations";
import {
	IKeyCommandHelper,
	IValidKeyCommands,
} from "../common/definitions/key-commands";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";
import { IStartService } from "./../definitions/start-service.d";

export default class StartService implements IStartService {
	ios: ChildProcess;
	android: ChildProcess;
	verbose: boolean = false;

	constructor(
		private $keyCommandHelper: IKeyCommandHelper,
		private $childProcess: IChildProcess,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $projectData: IProjectData,
		private $logger: ILogger
	) {}

	toggleVerbose(): void {
		this.verbose = true;
		this.$logger.info(
			this.verbose ? `Verbose logging enabled` : `Verbose logging disabled`
		);
	}

	format(data: Buffer, platform: string) {
		return data;
	}

	async runForPlatform(platform: string) {
		const platformLowerCase = platform.toLowerCase();
		(this as any)[platformLowerCase] = this.$childProcess.spawn(
			"../nativescript-cli/bin/ns",
			["run", platform.toLowerCase()],
			{
				cwd: this.$projectData.projectDir,
				stdio: ["ipc"],
				env: {
					FORCE_COLOR: 1,
					HIDE_HEADER: true,
					...process.env,
				},
			}
		);

		(this as any)[platformLowerCase].stdout.on("data", (data: Buffer) => {
			process.stdout.write(this.format(data, platform));
		});

		(this as any)[platformLowerCase].stderr.on("data", (data: Buffer) => {
			process.stderr.write(this.format(data, platform));
		});
	}

	async runIOS(): Promise<void> {
		this.runForPlatform(this.$devicePlatformsConstants.iOS);
	}

	async runAndroid(): Promise<void> {
		this.runForPlatform(this.$devicePlatformsConstants.Android);
	}
	async stopIOS(): Promise<void> {
		if (this.ios) {
			this.ios.kill("SIGINT");
		}
	}
	async stopAndroid(): Promise<void> {
		if (this.android) {
			this.android.kill("SIGINT");
		}
	}

	start() {
		this.addKeyCommandOverrides();
		this.$keyCommandHelper.attachKeyCommands("all", "start");
		this.$keyCommandHelper.printCommands("all");
	}

	addKeyCommandOverrides() {
		const keys: IValidKeyCommands[] = ["w", "r", "R"];

		for (let key of keys) {
			this.$keyCommandHelper.addOverride(key, async () => {
				this.ios?.send(key);
				this.android?.send(key);

				return false;
			});
		}

		this.$keyCommandHelper.addOverride("c", async () => {
			await this.stopIOS();
			await this.stopAndroid();

			const clean = this.$childProcess.spawn("ns", ["clean"]);
			clean.stdout.on("data", (data) => {
				process.stdout.write(data);
				if (
					data.toString().includes("Project successfully cleaned.") ||
					data.toString().includes("Project unsuccessfully cleaned.")
				) {
					clean.kill("SIGINT");
				}
			});
			return false;
		});
	}
}

injector.register("startService", StartService);
