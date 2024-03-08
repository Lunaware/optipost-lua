/* eslint-disable roblox-ts/lua-truthiness */

/**
 *	@module Optipost
 *	@author methamphetqmine
 *	@version 1.0.0
 */

import { HttpService, RunService } from "@rbxts/services";
import { Trove } from "@rbxts/trove";
import { HttpRequest, HttpQueue, type HttpResponse, HttpRequestPriority } from "@rbxts/http-queue";
import { Signal } from "@rbxts/beacon";

const OptipostHttpPool = new HttpQueue({
	retryAfter: { cooldown: 5 },
	maxSimultaneousSendOperations: 5,
});

interface Job {
	Identifier: string;
	Task: string;
}

class Optipost {
	Authorization?: string;
	baseUrl: string;
	PlaceId: number = game.PlaceId;
	JobId: string = game.JobId;
	isConnected: boolean = false;
	queryTime: number = 30;
	lastQueried: number = os.clock();
	debug: boolean = false;

	Trove: Trove = new Trove();
	OnJobRecieved: Signal<{ Identifier: string; Task: string } | unknown> = new Signal();

	constructor(baseUrl: string, Authorization?: string) {
		this.Authorization = Authorization || undefined;
		this.baseUrl = baseUrl;

		this.Trove.connect(RunService.Heartbeat, () => {
			if (this.lastQueried - os.clock() > this.queryTime) {
				if (this.isConnected === true) {
					this.FetchJobs();
				} else {
					this.Connect();

					if (this.debug === true) {
						warn("[Optipost]: Reconnecting to the server.");
					}
				}
			}
		});
	}

	/**
	 * Connects to the server using a POST request and returns a promise that resolves to an HttpResponse.
	 * If the request is successful and the response status code is 200, sets the `isConnected` property to true.
	 * @returns A promise that resolves to an HttpResponse.
	 */
	public Connect(): Promise<HttpResponse> {
		const headers = this.Authorization ? { Authorization: this.Authorization } : undefined;

		const request: HttpRequest = new HttpRequest(
			`${this.baseUrl}/connect`,
			"POST",
			HttpService.JSONEncode({ JobId: this.JobId }),
			undefined,
			headers,
		);

		return OptipostHttpPool.Push(request, HttpRequestPriority.First).then(
			(response: HttpResponse): HttpResponse => {
				if (response.RequestSuccessful === true && response.StatusCode === 200) {
					this.isConnected = true;

					if (this.debug === true) {
						warn("[Optipost]: Optipost has connected to the server.");
					}
				} else if (response.StatusCode === 401) {
					warn("[Optipost]: Invalid Authorization token.");
				}

				return response;
			},
		);
	}

	/**
	 * Fetches the jobs from the server.
	 * @returns A promise that resolves to an HttpResponse object.
	 * @throws {Error} If Optipost is not connected to the server.
	 */
	private FetchJobs(): Promise<HttpResponse> {
		assert(this.isConnected, "Optipost is not connected to the server.");

		const headers = this.Authorization ? { Authorization: this.Authorization } : undefined;

		const request: HttpRequest = new HttpRequest(
			`${this.baseUrl}/jobs/${this.JobId}`,
			"GET",
			undefined,
			undefined,
			headers,
		);

		return OptipostHttpPool.Push(request, HttpRequestPriority.Normal).then(
			(response: HttpResponse): HttpResponse => {
				if (response.StatusCode === 404) {
					this.isConnected = false;
				} else if (response.StatusCode === 401) {
					warn("[Optipost]: Invalid Authorization token.");
				} else if (response.StatusCode === 200) {
					const Jobs = HttpService.JSONDecode(response.Body) as Job[];

					Jobs.forEach(({ Identifier, Task }: Job) => {
						if (this.debug === true) {
							warn("[Optipost]: ", Identifier, Task);
						}

						this.OnJobRecieved.Fire({ Identifier, Task });
					});
				}

				return response;
			},
		);
	}

	/**
	 * Destroys the object and cleans up any resources associated with it.
	 */
	Destroy(): void {
		this.isConnected = false;
		this.Trove.destroy();

		if (this.debug === true) {
			warn("[Optipost]: Optipost instance has been destroyed.");
		}
	}
}

export = Optipost;
