import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);

  // Observable that emits, when a loading indicator should be displayed / hidden
  loading$ = this.loadingSubject as Observable<boolean>;

  private openRequests = 0;

  /**
   * Change status of loading indicator when sending a request.
   * Only when the first response is send, a new status is emitted.
   */
  startRequest() {
    this.openRequests += 1;

    // only send a new status on first request
    if (this.openRequests === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Change status of loading indicator when receiving a response.
   * Only when the last response arrived, a new status is emitted.
   */
  receivedResponse() {
    this.openRequests -= 1;

    // only send a new status on last response
    if (this.openRequests === 0) {
      this.loadingSubject.next(false);
    }

    // limit number of open requests to '0' as the minimum
    this.openRequests = Math.max(this.openRequests, 0);
  }
}
