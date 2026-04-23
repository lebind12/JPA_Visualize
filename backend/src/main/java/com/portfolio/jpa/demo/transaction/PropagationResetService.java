package com.portfolio.jpa.demo.transaction;

import com.portfolio.jpa.domain.audit.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PropagationResetService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void resetAuditFor(long memberId) {
        auditLogRepository.deleteByMemberId(memberId);
    }

    @Transactional(readOnly = true)
    public long countAuditFor(long memberId) {
        return auditLogRepository.countByMemberId(memberId);
    }
}
