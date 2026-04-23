package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.domain.audit.AuditLog;
import com.portfolio.jpa.domain.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PropagationAuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRED)
    public void writeAuditRequired(long memberId, String message) {
        auditLogRepository.saveAndFlush(AuditLog.create(memberId, message));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeAuditRequiresNew(long memberId, String message) {
        auditLogRepository.saveAndFlush(AuditLog.create(memberId, message));
    }
}
