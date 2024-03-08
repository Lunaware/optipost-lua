/* eslint-disable roblox-ts/lua-truthiness */

/**
 *	@module Optipost
 *	@author methamphetqmine
 */

import { HttpService } from "@rbxts/services";
import { Trove } from "@rbxts/trove";
import { HttpRequest, HttpQueue, HttpResponse, HttpRequestPriority } from "@rbxts/http-queue";
import { Signal } from "@rbxts/beacon";

const OptipostHttpPool = new HttpQueue({
	retryAfter: { cooldown: 5 },
	maxSimultaneousSendOperations: 5,
});

class Optipost {
	Authorization: undefined | string;
	baseUrl: string;
	PlaceId: number = game.PlaceId;
	JobId: string = game.JobId;
	isConnected: boolean = false;
	queryTime: number = 30;

	Trove: Trove = new Trove();
	OnJobRecieved: Signal<{ Identifier: string; Task: string } | unknown> = new Signal();

	constructor(baseUrl: string, Authorization: string | undefined) {
		this.Authorization = Authorization || undefined;
		this.baseUrl = baseUrl;
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

		return OptipostHttpPool.Push(request, HttpRequestPriority.First).andThen(
			(response: HttpResponse): HttpResponse => {
				if (response.RequestSuccessful === true && response.StatusCode === 200) {
					this.isConnected = true;
				} else if (response.StatusCode === 403) {
					warn("[OPTIPOST]: Invalid Authorization token.");
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

		return OptipostHttpPool.Push(request, HttpRequestPriority.Normal).andThen(
			(response: HttpResponse): HttpResponse => {
				if (response.StatusCode === 404) {
					this.isConnected = false;
				} else if (response.StatusCode === 403) {
					warn("[OPTIPOST]: Invalid Authorization token.");
				} else if (response.StatusCode === 200) {
					const Jobs = HttpService.JSONDecode(response.Body) as [{ Identifier: string; Task: string }];

					Jobs.forEach(({ Identifier, Task }: { Identifier: string; Task: string }) => {
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
	}
}

export = Optipost;
