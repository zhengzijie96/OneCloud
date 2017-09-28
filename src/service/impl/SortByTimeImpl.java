package service.impl;

import java.time.LocalDateTime;
import java.util.Arrays;

import service.SortService;
import service.dto.Sortable;

public class SortByTimeImpl implements SortService {

    @Override
    public void serve(Sortable[] array) {
        Arrays.sort(array, (s1, s2) -> {
            LocalDateTime ldt1 = s1.getLdtModified();
            LocalDateTime ldt2 = s2.getLdtModified();
            return ldt1.compareTo(ldt2);
        });
    }

}
