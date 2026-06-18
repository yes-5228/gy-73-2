import json

from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from orders.models import MoveOrder
from workers.models import Worker

from .models import ProgressEvent


def event_to_dict(event):
    return {
        "id": event.id,
        "order_id": event.order_id,
        "stage": event.stage,
        "stage_label": event.get_stage_display(),
        "message": event.message,
        "created_at": event.created_at.isoformat(),
    }


@csrf_exempt
@require_http_methods(["POST"])
def add_progress(request, order_id):
    payload = json.loads(request.body.decode("utf-8"))
    worker = None
    if payload.get("worker_id"):
        worker = get_object_or_404(Worker, pk=payload["worker_id"])

    stage = payload["stage"]
    with transaction.atomic():
        order = get_object_or_404(MoveOrder.objects.select_for_update(), pk=order_id)

        event = ProgressEvent.objects.create(
            order=order,
            worker=worker,
            stage=stage,
            message=payload.get("message") or dict(ProgressEvent.STAGE_CHOICES).get(stage, stage),
        )
        if stage == ProgressEvent.STAGE_COMPLETED:
            order.status = MoveOrder.STATUS_COMPLETED
            worker_ids_to_release = set()
            if order.assigned_to_id:
                worker_ids_to_release.add(order.assigned_to_id)
            if order.claimed_by_id:
                worker_ids_to_release.add(order.claimed_by_id)
            if worker_ids_to_release:
                Worker.objects.filter(
                    id__in=worker_ids_to_release,
                    status=Worker.STATUS_BUSY,
                ).update(status=Worker.STATUS_AVAILABLE)
        elif stage in [ProgressEvent.STAGE_DEPARTED, ProgressEvent.STAGE_LOADING, ProgressEvent.STAGE_IN_TRANSIT, ProgressEvent.STAGE_UNLOADING]:
            order.status = MoveOrder.STATUS_IN_PROGRESS
        order.save(update_fields=["status", "updated_at"])

    return JsonResponse(event_to_dict(event), status=201)
