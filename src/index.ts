/* eslint-disable roblox-ts/lua-truthiness */

/**
 *	@module Optipost
 *	@author methamphetqmine
 */

import {} from "@rbxts/services";
import { Trove } from "@rbxts/trove";
import { HttpRequest, HttpQueue, HttpResponse } from "@rbxts/http-queue";

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

	Trove: Trove = new Trove();

	constructor(baseUrl: string, Authorization: string | undefined) {
		this.Authorization = Authorization || undefined;
		this.baseUrl = baseUrl;
	}

	public Connect(): HttpRequest {
		const request: HttpRequest = new HttpRequest(`${this.baseUrl}/connect`, "POST", undefined, undefined);

		OptipostHttpPool.Push(request).then((response: HttpResponse) => {
			if (response) {
				this.isConnected = true;
			}
		});

		return request;
	}

	Destroy(): void {
		this.isConnected = false;
		this.Trove.destroy();
	}
}

export = Optipost;
